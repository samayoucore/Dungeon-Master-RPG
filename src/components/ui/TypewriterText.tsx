import { useEffect, useRef, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  onComplete?: () => void;
  /** Render the full text immediately, no animation. */
  instant?: boolean;
}

const DEFAULT_SPEED = 18;

/**
 * Prints text character-by-character. The animation (re)starts only when `text`
 * changes — never on unrelated parent re-renders — and can be skipped with a
 * click or the spacebar (ignored while a form field is focused).
 */
export default function TypewriterText({
  text,
  speed = DEFAULT_SPEED,
  onComplete,
  instant = false,
}: TypewriterTextProps) {
  const [shown, setShown] = useState(instant ? text : '');
  const [typing, setTyping] = useState(!instant && text.length > 0);

  const intervalRef = useRef<number | null>(null);
  const completeRef = useRef(onComplete);
  const textRef = useRef(text);
  const typingRef = useRef(typing);
  completeRef.current = onComplete;
  textRef.current = text;
  typingRef.current = typing;

  const clear = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const skip = () => {
    if (!typingRef.current) return;
    clear();
    setShown(textRef.current);
    setTyping(false);
    completeRef.current?.();
  };
  const skipRef = useRef(skip);
  skipRef.current = skip;

  // (Re)start typing whenever the text (or mode) changes.
  useEffect(() => {
    clear();
    if (instant || text.length === 0) {
      setShown(text);
      setTyping(false);
      completeRef.current?.();
      return;
    }
    setShown('');
    setTyping(true);
    let i = 0;
    intervalRef.current = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clear();
        setTyping(false);
        completeRef.current?.();
      }
    }, speed);
    return clear;
  }, [text, speed, instant]);

  // Spacebar skips, unless the user is typing into a form field.
  useEffect(() => {
    if (instant) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      event.preventDefault();
      skipRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [instant]);

  return (
    <span onClick={() => skipRef.current()} className={typing ? 'cursor-pointer' : undefined}>
      {shown}
      {typing && <span className="typewriter-cursor" aria-hidden="true" />}
    </span>
  );
}
