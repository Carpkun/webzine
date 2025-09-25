// 프로덕션 환경에서 사용할 로깅 유틸리티
// 개발 환경에서는 console 출력, 프로덕션에서는 필요시 외부 서비스 연동 가능

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  contentId?: string
  action?: string
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private shouldLog(level: LogLevel): boolean {
    // 프로덕션에서는 warn과 error만 로깅
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error'
    }
    return true
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorInfo = error instanceof Error ? error.stack : String(error)
      const fullContext = { ...context, error: errorInfo }
      console.error(this.formatMessage('error', message, fullContext))
      
      // 프로덕션에서는 여기서 외부 에러 추적 서비스에 전송 가능
      // 예: Sentry, LogRocket, DataDog 등
    }
  }

  // API 에러 전용 메서드
  apiError(endpoint: string, error: Error | unknown, context?: LogContext): void {
    this.error(`API Error in ${endpoint}`, error, { 
      ...context, 
      endpoint, 
      type: 'api_error' 
    })
  }

  // 데이터베이스 에러 전용 메서드
  dbError(operation: string, error: Error | unknown, context?: LogContext): void {
    this.error(`Database Error in ${operation}`, error, { 
      ...context, 
      operation, 
      type: 'db_error' 
    })
  }

  // 사용자 액션 로깅 (분석용)
  userAction(action: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.info(`User Action: ${action}`, context)
    }
    // 프로덕션에서는 분석 서비스에 전송 가능
  }
}

export const logger = new Logger()

// 기존 console.error를 대체할 때 사용할 편의 함수들
export const logError = (message: string, error?: Error | unknown, context?: LogContext) => {
  logger.error(message, error, context)
}

export const logWarning = (message: string, context?: LogContext) => {
  logger.warn(message, context)
}

export const logInfo = (message: string, context?: LogContext) => {
  logger.info(message, context)
}

// 디버그는 개발 환경에서만
export const logDebug = (message: string, context?: LogContext) => {
  logger.debug(message, context)
}