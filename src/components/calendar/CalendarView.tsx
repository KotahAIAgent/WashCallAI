'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  getDay
} from 'date-fns'

interface Appointment {
  id: string
  title: string
  start_time: string
  end_time: string
  leads?: {
    name: string | null
    phone: string | null
  } | null
}

interface CalendarViewProps {
  appointments: Appointment[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView({ appointments }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter(apt => isSameDay(new Date(apt.start_time), day))
  }

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex">
              <Button variant="outline" size="icon" className="rounded-r-none" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-l-none border-l-0" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {days.map((day, index) => {
            const dayAppointments = getAppointmentsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isDayToday = isToday(day)

            return (
              <div
                key={index}
                className={`min-h-24 p-2 bg-card ${
                  !isCurrentMonth ? 'bg-muted/50' : ''
                } ${isDayToday ? 'ring-2 ring-primary ring-inset' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  !isCurrentMonth 
                    ? 'text-muted-foreground' 
                    : isDayToday 
                      ? 'text-primary' 
                      : ''
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map(apt => (
                    <div
                      key={apt.id}
                      className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 transition-colors"
                      title={`${apt.title} - ${format(new Date(apt.start_time), 'h:mm a')}`}
                    >
                      <span className="font-medium">
                        {format(new Date(apt.start_time), 'h:mm')}
                      </span>
                      {' '}
                      <span className="hidden sm:inline">
                        {apt.leads?.name || apt.title}
                      </span>
                    </div>
                  ))}
                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayAppointments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/10 border border-primary/30" />
            <span>Scheduled appointment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded ring-2 ring-primary" />
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

