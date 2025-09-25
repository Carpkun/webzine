'use client'

import { Comment } from '../../../lib/types'
import CommentItem from './CommentItem'

interface CommentListProps {
  comments: Comment[]
  onCommentDeleted: (commentId: string) => void
}

export default function CommentList({ comments, onCommentDeleted }: CommentListProps) {
  if (comments.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onCommentDeleted={onCommentDeleted}
        />
      ))}
    </div>
  )
}