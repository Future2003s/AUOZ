"use client";

const Snowfall = () => {
  const snowflakes = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 3 + 5}s`,
    animationDelay: `${Math.random() * 5}s`,
    opacity: Math.random() * 0.5 + 0.3,
    size: Math.random() * 10 + 5 + 'px'
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden" aria-hidden="true">
      <style>
        {`
          @keyframes snowfall {
            0% { transform: translateY(-10vh) translateX(0); }
            100% { transform: translateY(100vh) translateX(20px); }
          }
          .animate-snow {
            animation: snowfall linear infinite;
          }
        `}
      </style>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-[-20px] text-white animate-snow"
          style={{
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            opacity: flake.opacity,
            fontSize: flake.size,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export { Snowfall };
