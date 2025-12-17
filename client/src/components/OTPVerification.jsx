import { useState, useEffect } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'

const OTPVerification = ({ email, onVerify, onBack, onResend }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timer, setTimer] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0]
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char
    })
    setOtp(newOtp)

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5)
    document.getElementById(`otp-${lastIndex}`)?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')

    if (otpString.length !== 6) {
      alert('Please enter complete OTP')
      return
    }

    setLoading(true)
    try {
      await onVerify(otpString)
    } catch (error) {
      console.error('OTP verification error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setCanResend(false)
    setTimer(600)
    setOtp(['', '', '', '', '', ''])
    await onResend()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary-100 dark:bg-primary-900 p-4 rounded-full">
            <Mail className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verify Your Email
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We've sent a 6-digit code to
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
          {email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="text-center">
          {timer > 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Code expires in{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {formatTime(timer)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              OTP has expired
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6 || timer === 0}
          className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={!canResend}
            className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {canResend ? 'Resend OTP' : 'Resend available after expiry'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default OTPVerification
