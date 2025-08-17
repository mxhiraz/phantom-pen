export const LoadingSection = () => {
  return (
    <div className="flex animate-pulse max-md:px-3">
      <svg
        width="20"
        height="4"
        viewBox="0 0 20 4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="4" height="4" rx="2" fill="#364153" />
        <g opacity="0.8">
          <rect x="8" width="4" height="4" rx="2" fill="#364153" />
        </g>
        <g opacity="0.6">
          <rect x="16" width="4" height="4" rx="2" fill="#364153" />
        </g>
      </svg>
    </div>
  );
};

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className=" h-20 w-32">
        <img
          src="https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/04-unscreen.gif"
          alt="Loading..."
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
