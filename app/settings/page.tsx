"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { RequireAuth } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { resetPassword } from "@/lib/auth/auth-utils"
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  Gamepad2, 
  Edit, 
  Trash2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { user, userProfile, userEmail, isEmailVerified } = useAuth()
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState(userEmail || "")

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address")
      return
    }

    setIsResettingPassword(true)
    try {
      const { error } = await resetPassword({ email: resetEmail })
      
      if (error) {
        toast.error(error.message || "Failed to send password reset email")
      } else {
        toast.success("Password reset email sent! Check your inbox.")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleDeleteAccount = () => {
    // Placeholder - account deletion would need backend implementation
    toast.info("Account deletion is not yet implemented. Please contact support.")
  }

  return (
    <RequireAuth 
      showLoadingSkeleton={true}
      errorMessage="You need to be signed in to access settings"
    >
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <Navigation />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Account
                </CardTitle>
                <CardDescription>
                  Manage your account details and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="email" 
                      value={userEmail || ""} 
                      disabled 
                      className="flex-1"
                    />
                    {isEmailVerified ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your email address cannot be changed directly. Contact support if you need to update it.
                  </p>
                </div>

                <Separator />

                {/* Password Reset */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="email" 
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handlePasswordReset}
                      disabled={isResettingPassword || !resetEmail}
                      variant="outline"
                    >
                      {isResettingPassword ? "Sending..." : "Reset Password"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We'll send you an email with a link to reset your password
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Profile
                </CardTitle>
                <CardDescription>
                  Customize your public profile and display information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Edit Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Update your username, display name, bio, and avatar
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/profile/edit">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">View Public Profile</p>
                    <p className="text-sm text-muted-foreground">
                      See how your profile appears to others
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/profile/${userProfile?.username || ""}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>
                  Control who can see your information and gaming activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Privacy Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Manage profile visibility and data sharing preferences
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/privacy">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Privacy Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gaming Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5" />
                  Gaming Preferences
                </CardTitle>
                <CardDescription>
                  Set your favorite genres, platforms, and gaming interests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Gaming Preferences</p>
                    <p className="text-sm text-muted-foreground">
                      Update your gaming profile and preferences
                    </p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/profile/gaming-preferences">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Update Preferences
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers, including:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Your profile and gaming preferences</li>
                            <li>Your game library and reviews</li>
                            <li>Your friends and follows</li>
                            <li>Your activity history</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Delete My Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
