import mongoose, { Schema, Types } from 'mongoose';
import { DuplicateEmailError } from '../errors';
import { CATEGORIES, type Category, type Reminder, type ReminderInput, type User } from '../types';
import type { ReminderRepo, UserRepo } from './types';

// Forma de los documentos tal como los devuelve .lean() (objetos planos).
interface UserLean {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface ReminderLean {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  category: Category;
  dueDate: string;
  remindDaysBefore: number[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

const reminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    category: { type: String, required: true, enum: CATEGORIES },
    dueDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    remindDaysBefore: { type: [Number], default: [] },
  },
  { timestamps: true },
);

const UserModel = mongoose.model('User', userSchema);
const ReminderModel = mongoose.model('Reminder', reminderSchema);

/** Crea los índices (por ejemplo el email único) antes de recibir tráfico. */
export async function ensureIndexes(): Promise<void> {
  await Promise.all([UserModel.init(), ReminderModel.init()]);
}

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;
}

function toUser(d: UserLean): User {
  return { id: d._id.toString(), email: d.email, passwordHash: d.passwordHash, createdAt: d.createdAt };
}

function toReminder(d: ReminderLean): Reminder {
  return {
    id: d._id.toString(),
    userId: d.userId.toString(),
    title: d.title,
    category: d.category,
    dueDate: d.dueDate,
    remindDaysBefore: d.remindDaysBefore,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export class MongoUserRepo implements UserRepo {
  async findByEmail(email: string): Promise<User | null> {
    const doc = (await UserModel.findOne({ email }).lean()) as unknown as UserLean | null;
    return doc ? toUser(doc) : null;
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    try {
      const doc = await UserModel.create({ email: data.email, passwordHash: data.passwordHash });
      return toUser(doc.toObject() as unknown as UserLean);
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new DuplicateEmailError();
      throw err;
    }
  }
}

export class MongoReminderRepo implements ReminderRepo {
  async listByUser(userId: string): Promise<Reminder[]> {
    if (!OBJECT_ID.test(userId)) return [];
    const docs = (await ReminderModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ dueDate: 1 })
      .lean()) as unknown as ReminderLean[];
    return docs.map(toReminder);
  }

  async create(userId: string, data: ReminderInput): Promise<Reminder> {
    const doc = await ReminderModel.create({ userId: new Types.ObjectId(userId), ...data });
    return toReminder(doc.toObject() as unknown as ReminderLean);
  }

  async update(userId: string, id: string, data: ReminderInput): Promise<Reminder | null> {
    if (!OBJECT_ID.test(id) || !OBJECT_ID.test(userId)) return null;
    const doc = (await ReminderModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true, runValidators: true },
    ).lean()) as unknown as ReminderLean | null;
    return doc ? toReminder(doc) : null;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    if (!OBJECT_ID.test(id) || !OBJECT_ID.test(userId)) return false;
    const res = await ReminderModel.deleteOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    return res.deletedCount === 1;
  }
}
