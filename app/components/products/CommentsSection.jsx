'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function CommentsSection({
  comments,
  currentUser,
  onSubmitComment,
  onReply,
  submittingComment,
  router
}) {
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState(0);
  const [replyTo, setReplyTo] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitComment(commentText, rating, replyTo);
    setCommentText('');
    setRating(0);
    setReplyTo(null);
  };

  const handleReply = (commentId) => {
    onReply(commentId);
    setReplyTo(commentId);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentText('');
  };

  return (
    <div className="p-4 lg:p-8 bg-surface-secondary border border-border-primary rounded-xl lg:rounded-2xl mt-4 lg:mt-0">
      <h3 className="text-[1.25rem] font-bold text-text-primary mb-6">Ulasan & Komentar ({comments.length})</h3>

      {/* Comment Form */}
      {currentUser ? (
        <form className="mb-4 lg:mb-8 p-3 lg:p-6 bg-surface-primary border border-border-primary rounded-xl" onSubmit={handleSubmit}>
          {replyTo && (
            <div className="flex items-center justify-between px-4 py-2 bg-surface-tertiary rounded-lg mb-4 text-sm text-text-secondary">
              <span>Membalas komentar...</span>
              <button type="button" onClick={cancelReply} className="bg-transparent border-0 text-text-secondary text-xl cursor-pointer px-2 py-0 transition-colors hover:text-error">
                ✕
              </button>
            </div>
          )}

          {!replyTo && (
            <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
              <span className="text-sm lg:text-sm font-semibold text-text-secondary">Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`bg-transparent border-0 text-2xl lg:text-[32px] cursor-pointer transition-all p-0 ${
                    star <= rating ? 'text-warning scale-110' : 'text-surface-tertiary'
                  } hover:text-warning hover:scale-110`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          )}

          <textarea
            className="w-full min-h-[80px] lg:min-h-[100px] p-3 lg:p-4 bg-surface-secondary border border-border-primary rounded-lg text-text-primary text-sm lg:text-[15px] font-sans leading-relaxed resize-vertical outline-none transition-colors focus:border-info"
            placeholder={replyTo ? "Tulis balasan..." : "Tulis komentar Anda..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            maxLength={1000}
          />

          <div className="flex items-center justify-between mt-3 lg:mt-4">
            <span className="text-[0.8125rem] text-text-muted mt-1.5">{commentText.length}/1000</span>
            <button
              type="submit"
              className="py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-accent text-white hover:bg-accent-hover hover:-translate-y-px"
              disabled={submittingComment || !commentText.trim()}
            >
              {submittingComment ? 'Mengirim...' : replyTo ? 'Kirim Balasan' : 'Kirim Komentar'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 lg:py-10 px-4 lg:px-5 bg-surface-primary border border-border-primary rounded-xl mb-4 lg:mb-8">
          <p className="text-sm lg:text-[15px] text-text-secondary mb-3 lg:mb-4">Silakan login untuk memberikan komentar</p>
          <button className="py-3 px-6 rounded-lg font-medium cursor-pointer transition-all border-none text-sm inline-flex items-center justify-center gap-2 bg-accent text-white hover:bg-accent-hover hover:-translate-y-px" onClick={() => router.push('/login')}>
            Login
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col gap-3 lg:gap-5">
        {comments.length === 0 ? (
          <div className="text-center py-2.5 lg:py-[60px] px-2.5 lg:px-5 text-text-secondary text-sm lg:text-[15px]">
            <p>Belum ada komentar. Jadilah yang pertama!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-3 lg:p-6 bg-surface-primary border border-border-primary rounded-xl transition-all hover:border-info">
              <div className="flex items-start justify-between mb-3 lg:mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-9 h-9 lg:w-12 lg:h-12 bg-surface-tertiary border border-border-primary rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {comment.user_avatar ? (
                      <Image src={comment.user_avatar} alt={comment.user_name} fill />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] lg:w-6 h-[18px] lg:h-6 text-text-secondary">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm lg:text-[15px] font-semibold text-text-primary flex items-center gap-2">
                      {comment.user_name}
                      {comment.is_seller_reply && (
                        <span className="px-2 py-0.5 bg-info text-white text-[10px] lg:text-[11px] font-semibold rounded-xl">Penjual</span>
                      )}
                    </span>
                    <span className="text-xs lg:text-[13px] text-text-muted">
                      {new Date(comment.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                {comment.rating && (
                  <div className="flex gap-1">
                    {[...Array(comment.rating)].map((_, i) => (
                      <span key={i} className="text-base lg:text-lg text-warning">★</span>
                    ))}
                    {[...Array(5 - comment.rating)].map((_, i) => (
                      <span key={i} className="text-base lg:text-lg text-surface-tertiary">★</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3 lg:mb-4">
                <p className="text-sm lg:text-[15px] leading-normal lg:leading-relaxed text-text-secondary whitespace-pre-wrap">{comment.comment}</p>
              </div>

              <div className="flex gap-4">
                <button
                  className="flex items-center gap-1.5 bg-transparent border-0 text-text-secondary text-sm lg:text-sm font-medium cursor-pointer py-1 px-3 rounded-md transition-all hover:bg-surface-tertiary hover:text-text-primary"
                  onClick={() => handleReply(comment.id)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 lg:w-4 h-3.5 lg:h-4">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  Balas ({comment.reply_count})
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}