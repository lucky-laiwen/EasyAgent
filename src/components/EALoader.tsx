const EALoader = ({ text }: { text: string }) => {
  return (
    <div className="relative flex items-center justify-center h-[80px] m-0 font-['Poppins'] text-[1.6em] font-semibold text-[var(--Ai-content-text)] select-none">
      {/* Letters */}
      {text.split("").map((char, index) => (
        <span
          key={index}
          className={`loader-letter inline-block opacity-0 z-10`}
          style={{ animationDelay: `${0.1 + index * 0.105}s` }}
        >
          {char}
        </span>
      ))}

      {/* Animated mask layer */}
      <div className="loader absolute inset-0 z-0 pointer-events-none" />

      {/* CSS only once */}
      <style>{`
        .loader {
          background-color: transparent;
          mask: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent 6px,
            black 7px,
            black 8px
          );
        }

        .loader::after {
          content: "";
          position: absolute;
          inset: 0;

          background-image:
            radial-gradient(circle at 50% 50%, #ff0 0%, transparent 50%),
            radial-gradient(circle at 45% 45%, #f00 0%, transparent 45%),
            radial-gradient(circle at 55% 55%, #0ff 0%, transparent 45%),
            radial-gradient(circle at 45% 55%, #0f0 0%, transparent 45%),
            radial-gradient(circle at 55% 45%, #00f 0%, transparent 45%);

          mask: radial-gradient(
            circle at 50% 50%,
            transparent 0%,
            transparent 10%,
            black 25%
          );

          animation:
            transform-animation 2s infinite alternate cubic-bezier(0.6, 0.8, 0.5, 1),
            opacity-animation 4s infinite;
        }

        @keyframes transform-animation {
          0% {
            transform: translateX(-55%);
          }
          100% {
            transform: translateX(55%);
          }
        }

        @keyframes opacity-animation {
          0%, 100% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          65% {
            opacity: 0;
          }
        }

        .loader-letter {
          animation: loader-letter-anim 4s infinite linear;
        }

        @keyframes loader-letter-anim {
          0% {
            opacity: 0;
          }
          5% {
            opacity: 1;
            text-shadow: 0 0 4px #fff;
            transform: scale(1.1) translateY(-2px);
          }
          20% {
            opacity: 0.2;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EALoader;
