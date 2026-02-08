"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import { Star, MessageSquare, Calendar, User, Pen, Filter, TrendingUp } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface Review {
  id: string
  game_id: number
  user_id: string
  user_rating: number
  review: string
  updated_at: string
  game: {
    id: number
    name: string
    background_image: string
    released: string
  }
  profile?: {
    id: string
    username: string
    display_name: string
    avatar_url: string
  }
}

export default function ReviewsPage() {
  const { isAuthenticated, user, userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState(isAuthenticated ? "my-reviews" : "community")
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [communityReviews, setCommunityReviews] = useState<Review[]>([])
  const [isLoadingMy, setIsLoadingMy] = useState(false)
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false)

  // Fetch user's own reviews
  useEffect(() => {
    if (isAuthenticated && user && activeTab === "my-reviews") {
      fetchMyReviews()
    }
  }, [isAuthenticated, user, activeTab])

  // Fetch community reviews
  useEffect(() => {
    if (activeTab === "community") {
      fetchCommunityReviews()
    }
  }, [activeTab])

  const fetchMyReviews = async () => {
    if (!user) return
    
    setIsLoadingMy(true)
    try {
      const { data, error } = await supabase
        .from("user_games")
        .select(`
          id,
          game_id,
          user_id,
          user_rating,
          review,
          updated_at,
          game:games (
            id,
            name,
            background_image,
            released
          )
        `)
        .eq("user_id", user.id)
        .not("review", "is", null)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setMyReviews(data as any || [])
    } catch (error) {
      console.error("Error fetching my reviews:", error)
      toast.error("Failed to load your reviews")
    } finally {
      setIsLoadingMy(false)
    }
  }

  const fetchCommunityReviews = async () => {
    setIsLoadingCommunity(true)
    try {
      const { data, error } = await supabase
        .from("user_games")
        .select(`
          id,
          game_id,
          user_id,
          user_rating,
          review,
          updated_at,
          game:games (
            id,
            name,
            background_image,
            released
          ),
          profile:profiles!user_games_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .not("review", "is", null)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setCommunityReviews(data as any || [])
    } catch (error) {
      console.error("Error fetching community reviews:", error)
      toast.error("Failed to load community reviews")
    } finally {
      setIsLoadingCommunity(false)
    }
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-primary text-primary" />
        ))}
        {hasHalfStar && <Star className="w-4 h-4 fill-primary/50 text-primary" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 text-muted-foreground" />
        ))}
      </div>
    )
  }

  const ReviewCard = ({ review, showUser = false }: { review: Review; showUser?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Game Image */}
        <div className="w-full md:w-48 h-48 md:h-auto relative bg-muted">
          <Link href={`/games/${review.game_id}`}>
            <img
              src={review.game.background_image || "/placeholder.svg"}
              alt={review.game.name}
              className="w-full h-full object-cover hover:opacity-75 transition-opacity"
            />
          </Link>
        </div>

        {/* Review Content */}
        <div className="flex-1 p-6">
          <CardHeader className="p-0 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Link 
                  href={`/games/${review.game_id}`}
                  className="text-xl font-bold hover:text-primary transition-colors"
                >
                  {review.game.name}
                </Link>
                {review.game.released && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Released: {new Date(review.game.released).getFullYear()}
                  </p>
                )}
              </div>
              
              {/* User Rating */}
              <div className="flex flex-col items-end gap-2">
                {renderStars(review.user_rating)}
                <span className="text-sm font-medium">{review.user_rating.toFixed(1)}/5.0</span>
              </div>
            </div>

            {/* User Info (for community reviews) */}
            {showUser && review.profile && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={review.profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {(review.profile.display_name || review.profile.username || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Link 
                    href={`/profile/${review.profile.username}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {review.profile.display_name || review.profile.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    @{review.profile.username}
                  </p>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {/* Review Text */}
            <p className="text-muted-foreground leading-relaxed mb-4">
              {review.review}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(review.updated_at), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Review
                </span>
              </div>
              
              {!showUser && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/games/${review.game_id}`}>
                    Edit Review
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Game Reviews</h1>
              <p className="text-muted-foreground">
                Share your gaming experiences and discover what others think
              </p>
            </div>
            
            {isAuthenticated && (
              <Button asChild>
                <Link href="/games">
                  <Pen className="h-4 w-4 mr-2" />
                  Write a Review
                </Link>
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">{myReviews.length}</div>
                <div className="text-xs text-muted-foreground">Your Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-secondary">{communityReviews.length}</div>
                <div className="text-xs text-muted-foreground">Community Reviews</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-primary">
                  {myReviews.length > 0 
                    ? (myReviews.reduce((sum, r) => sum + r.user_rating, 0) / myReviews.length).toFixed(1)
                    : "0.0"
                  }
                </div>
                <div className="text-xs text-muted-foreground">Your Avg Rating</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-secondary">
                  <TrendingUp className="h-6 w-6 mx-auto" />
                </div>
                <div className="text-xs text-muted-foreground">Trending</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-reviews" disabled={!isAuthenticated}>
              <User className="h-4 w-4 mr-2" />
              My Reviews
            </TabsTrigger>
            <TabsTrigger value="community">
              <TrendingUp className="h-4 w-4 mr-2" />
              Community Reviews
            </TabsTrigger>
          </TabsList>

          {/* My Reviews Tab */}
          <TabsContent value="my-reviews" className="space-y-6">
            {!isAuthenticated ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Sign in to view your reviews</h3>
                  <p className="text-muted-foreground mb-6">
                    Create an account to write and manage your game reviews
                  </p>
                  <Button asChild>
                    <Link href="/games">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : isLoadingMy ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="h-64 animate-pulse bg-muted" />
                ))}
              </div>
            ) : myReviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start reviewing games to share your thoughts with the community
                  </p>
                  <Button asChild>
                    <Link href="/games">
                      <Pen className="h-4 w-4 mr-2" />
                      Write Your First Review
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {myReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Community Reviews Tab */}
          <TabsContent value="community" className="space-y-6">
            {isLoadingCommunity ? (
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="h-64 animate-pulse bg-muted" />
                ))}
              </div>
            ) : communityReviews.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No community reviews yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to share your gaming experiences with the community
                  </p>
                  {isAuthenticated && (
                    <Button asChild>
                      <Link href="/games">
                        <Pen className="h-4 w-4 mr-2" />
                        Write a Review
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {communityReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} showUser />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
