/**
 * Dirección del backend. Se define con la variable EXPO_PUBLIC_API_URL (archivo .env).
 *
 * Ojo: en un iPhone real "localhost" es el propio teléfono, no tu computadora.
 * Usá la IP de tu computadora en la red WiFi, por ejemplo http://192.168.1.20:4000
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
