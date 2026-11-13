export interface BookLesson {
  title: string
  challenge: boolean
}

export interface BookChapter {
  title: string
  lessons: BookLesson[]
}

export type BookChapters = Record<'en' | 'es', BookChapter[]>
