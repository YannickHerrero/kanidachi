import * as React from "react"
import { Platform } from "react-native"
import { MoreHorizontal, Undo2, RotateCcw, Check } from "lucide-react-native"
import * as Haptics from "expo-haptics"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useColorScheme } from "@/lib/useColorScheme"

interface ReviewActionsProps {
  canUndo: boolean
  isFlipped: boolean
  onUndo: () => void
  onAskAgainLater: () => void
  onMarkCorrect: () => void
}

export function ReviewActions({
  canUndo,
  isFlipped,
  onUndo,
  onAskAgainLater,
  onMarkCorrect,
}: ReviewActionsProps) {
  const { colorScheme } = useColorScheme()
  const [open, setOpen] = React.useState(false)
  const iconColor = colorScheme === "dark" ? "#fff" : "#000"

  const handleUndo = () => {
    setOpen(false)
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onUndo()
  }

  const handleAskAgainLater = () => {
    setOpen(false)
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onAskAgainLater()
  }

  const handleMarkCorrect = () => {
    setOpen(false)
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }
    onMarkCorrect()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal size={24} color={iconColor} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Ask Again Later - available anytime */}
        <DropdownMenuItem
          onPress={handleAskAgainLater}
          className="flex-row items-center gap-3"
        >
          <RotateCcw size={18} color={iconColor} />
          <Text>Ask Again Later</Text>
        </DropdownMenuItem>

        {/* Mark Correct - only when card is flipped (after seeing answer) */}
        {isFlipped && (
          <DropdownMenuItem
            onPress={handleMarkCorrect}
            className="flex-row items-center gap-3"
          >
            <Check size={18} color="#22c55e" />
            <Text className="text-green-600">Mark as Correct</Text>
          </DropdownMenuItem>
        )}

        {/* Undo - only available when there's history */}
        {canUndo && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onPress={handleUndo}
              className="flex-row items-center gap-3"
            >
              <Undo2 size={18} color={iconColor} />
              <Text>Undo Last Answer</Text>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
