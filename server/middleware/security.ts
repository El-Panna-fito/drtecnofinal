import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { verifySessionToken } from "../lib/auth.js";
import { env } from "../config/env.js";

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  admin?: {
    username: string;
    role: string;
  };
}

// 1. Rate Limiter for Admin Login (Prevents Brute-force attacks)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_ATTEMPTS",
      message: "Demasiados intentos de acceso fallidos. Por favor, intente nuevamente en 15 minutos."
    }
  }
});

// 2. Rate Limiter for Checkout Orders (Prevents Spam / Denial of Service)
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Por favor espere unos segundos antes de enviar un nuevo pedido."
    }
  }
});

// 3. Rate Limiter for Service Requests
export const serviceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Límite de solicitudes alcanzado. Intente en unos momentos."
    }
  }
});

// 4. Rate Limiter for Webhook
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

// 5. Admin Authentication Middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined = req.cookies?.dr_tecno_session;

  // Check Bearer authorization header fallback for API clients
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Acceso no autorizado. Debe iniciar sesión en el panel."
      }
    });
  }

  const session = verifySessionToken(token);
  if (!session) {
    res.clearCookie("dr_tecno_session");
    return res.status(401).json({
      success: false,
      error: {
        code: "SESSION_EXPIRED",
        message: "La sesión ha expirado o es inválida."
      }
    });
  }

  req.admin = {
    username: session.username,
    role: session.role
  };

  next();
}

// 6. Centralized Error Handler Middleware
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Structured logging for production observability (no secrets logged!)
  const logDetails = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    errorName: err.name || "Error",
    errorMessage: err.message || "Unknown error"
  };
  
  console.error("❌ [API Error]", JSON.stringify(logDetails));

  // Handle Zod Validation Errors
  if (err.name === "ZodError" && err.errors) {
    const errorDetails = err.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: `Datos inválidos: ${errorDetails}`
      }
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const publicMessage = env.isProduction
    ? (statusCode < 500 ? err.message : "Ha ocurrido un error en el servidor. Por favor intente más tarde.")
    : (err.message || "Error interno del servidor");

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: publicMessage
    }
  });
}
