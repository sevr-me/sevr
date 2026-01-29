import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

export function LoginModal({
  open,
  onOpenChange,
  loginStep,
  loginEmail,
  setLoginEmail,
  otpCode,
  setOtpCode,
  loginLoading,
  loginError,
  onRequestOtp,
  onVerifyOtp,
  onBack,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            {loginStep === 'email'
              ? 'Enter your email to receive a one-time code'
              : `Enter the code sent to ${loginEmail}`}
          </DialogDescription>
        </DialogHeader>

        {loginStep === 'email' ? (
          <form onSubmit={onRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {loginError && (
              <Alert variant="destructive">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loginLoading}>
              {loginLoading ? 'Sending...' : 'Send Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={setOtpCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {loginError && (
              <Alert variant="destructive">
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={onBack}>
                Back
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
