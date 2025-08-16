export const Footer = () => {
  return null;
  return (
    <div className="flex flex-col md:flex-row justify-between gap-2 px-4 py-[9px] items-center">
      <p className="text-xs text-center">
        <span className="text-xs text-center text-[#99a1af]">Powered by </span>
        <a
          target="_blank"
          rel="noopenner"
          href="https://console.groq.com/"
          className="text-xs text-center text-[#364153]"
        >
          Phantom Pen
        </a>
        <span className="text-xs text-center text-[#364153]"> on </span>
        <a
          target="_blank"
          rel="noopenner"
          href="https://console.groq.com/"
          className="text-xs text-center text-[#364153]"
        >
          Groq
        </a>
      </p>
    </div>
  );
};
