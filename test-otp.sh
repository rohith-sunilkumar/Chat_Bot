#!/bin/bash

echo "🧪 Testing OTP System..."
echo ""

# Test 1: Send OTP
echo "📤 Test 1: Sending OTP to test@example.com"
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "✅ Check the backend console for the OTP!"
echo ""
echo "📝 To test OTP verification, use:"
echo "curl -X POST http://localhost:5000/api/auth/verify-otp \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\":\"test@example.com\",\"otp\":\"YOUR_OTP_HERE\"}'"
