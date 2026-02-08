"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase/client"
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PauseCircle, 
  Plus, 
  ChevronDown, 
  ChevronUp,
  Star,
  Calendar,
  User,
  List as ListIcon
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UserGameWithGame {
  id: string
  game_id: number
  status: string
  user_rating: number | null
  hours_played: number
  completed: boolean
  is_favorite: boolean
  added_at: string
  updated_at: string
  game: {
    id: number
    name: string
    background_image: string
    released: string
    rating: number
    genres: any
  }
}

interface GamesByStatus {
  want_to_play: UserGameWithGame[]
  playing: UserGameWithGame[]
  completed: UserGameWithGame[]
  dropped: UserGameWithGame[]
  on_hold: UserGameWithGame[]
}

export default function ListsPage() {
  const { isAuthenticated, user } = useAuth()
  const [games, setGames] = useState<GamesByStatus>({
    want_to_play: [],
    playing: [],
    completed: [],
    dropped: [],
    on_hold: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    want_to_play: true,
    playing: true,
    completed: true,
    dropped: false,
    on_hold: false
  })

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserGames()
    }
  }, [isAuthenticated, user])

  const fetchUserGames = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("user_games")
        .select(`
          id,
          game_id,
          status,
          user_rating,
          hours_played,
          completed,
          is_favorite,
          added_at,
          updated_at,
          game:games (
            id,
            name,
            background_image,
            released,
            rating,
            genres
          )
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (error) throw error

      // Group games by status
      const groupedGames: GamesByStatus = {
        want_to_play: [],
        playing: [],
        completed: [],
        dropped: [],
        on_hold: []
      }

      data?.forEach((game: any) => {
        if (game.status && groupedGames[game.status as keyof GamesByStatus]) {
          groupedGames[game.status as keyof GamesByStatus].push(game)
        }
      })

      setGames(groupedGames)
    } catch (error) {
      console.error("Error fetching user games:", error)
      toast.error("Failed to load your game library")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (status: keyof GamesByStatus) => {
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }))
  }

  const getStatusConfig = (status: keyof GamesByStatus) => {
    const configs = {
      want_to_play: {
        label: "Want to Play",
        icon: Clock,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20"
      },
      playing: {
        label: "Currently Playing",
        icon: Play,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20"
      },
      completed: {
        label: "Completed",
        icon: CheckCircle2,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/20"
      },
      dropped: {
        label: "Dropped",
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20"
      },
      on_hold: {
        label: "On Hold",
        icon: PauseCircle,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20"
      }
    }
    return configs[status]
  }

  const GameCard = ({ game }: { game: UserGameWithGame }) => (
    <Link href={`/games/${game.game_id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
        <div className="flex gap-4">
          {/* Game Image */}
          <div className="w-32 h-48 relative bg-muted flex-shrink-0">
            <img
              src={game.game.background_image || "/placeholder.svg"}
              alt={game.game.name}
              className="w-full h-full object-cover"
            />
            {game.is_favorite && (
              <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                <Star className="h-4 w-4 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Game Info */}
          <div className="flex-1 p-4 min-w-0">
            <h3 className="font-semibold text-lg mb-2 truncate">{game.game.name}</h3>
            
            <div className="space-y-2 text-sm">
              {game.game.released && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(game.game.released).getFullYear()}</span>
                </div>
              )}

              {game.user_rating && (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{game.user_rating.toFixed(1)}/5.0</span>
                </div>
              )}

              {game.hours_played > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{game.hours_played}h played</span>
                </div>
              )}

              {game.game.genres && Array.isArray(game.game.genres) && game.game.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {game.game.genres.slice(0, 3).map((genre: any) => (
                    <Badge key={genre.id} variant="secondary" className="text-xs">
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )

  const StatusSection = ({ status }: { status: keyof GamesByStatus }) => {
    const config = getStatusConfig(status)
    const Icon = config.icon
    const gamesList = games[status]
    const isExpanded = expandedSections[status]

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleSection(status)}>
        <Card className={`border-2 ${config.borderColor}`}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className={`${config.bgColor} cursor-pointer hover:opacity-80 transition-opacity`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${config.color}`} />
                  <CardTitle className="text-xl">{config.label}</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    {gamesList.length}
                  </Badge>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-6">
              {gamesList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No games in this list yet</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {gamesList.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    )
  }

  const totalGames = Object.values(games).reduce((sum, list) => sum + list.length, 0)

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Game Lists</h1>
              <p className="text-muted-foreground">
                Organize and track your gaming journey
              </p>
            </div>
            
            {isAuthenticated && (
              <Button asChild>
                <Link href="/games">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Games
                </Link>
              </Button>
            )}
          </div>

          {/* Stats */}
          {isAuthenticated && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-blue-500">{games.want_to_play.length}</div>
                  <div className="text-xs text-muted-foreground">Want to Play</div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-green-500">{games.playing.length}</div>
                  <div className="text-xs text-muted-foreground">Playing</div>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/10 border-purple-500/20">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-purple-500">{games.completed.length}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-yellow-500">{games.on_hold.length}</div>
                  <div className="text-xs text-muted-foreground">On Hold</div>
                </CardContent>
              </Card>
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-red-500">{games.dropped.length}</div>
                  <div className="text-xs text-muted-foreground">Dropped</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Content */}
        {!isAuthenticated ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Sign in to manage your game lists</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create an account to track games you want to play, are currently playing, and have completed
              </p>
              <Button asChild size="lg">
                <Link href="/games">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
          </div>
        ) : totalGames === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <ListIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">Your game library is empty</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start building your gaming collection by adding games you want to play, are currently playing, or have completed
              </p>
              <Button asChild size="lg">
                <Link href="/games">
                  <Plus className="h-4 w-4 mr-2" />
                  Browse Games
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <StatusSection status="playing" />
            <StatusSection status="want_to_play" />
            <StatusSection status="completed" />
            <StatusSection status="on_hold" />
            <StatusSection status="dropped" />
          </div>
        )}
      </div>
    </div>
  )
}
