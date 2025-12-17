import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

export const formatMessageTime = (date) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return format(parsedDate, 'HH:mm')
}

export const formatChatListTime = (date) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  
  if (isToday(parsedDate)) {
    return format(parsedDate, 'HH:mm')
  } else if (isYesterday(parsedDate)) {
    return 'Yesterday'
  } else {
    return format(parsedDate, 'MMM dd')
  }
}

export const formatLastSeen = (date) => {
  if (!date) return 'Never'
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(parsedDate, { addSuffix: true })
}

export const formatFullDate = (date) => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date
  return format(parsedDate, 'PPpp')
}
