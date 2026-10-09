import logoImg from "@/assets/gym_logo.png";

export function Logo({
  imageClassName = "h-9 w-9",
  textClassName = "font-display text-lg font-bold",
  accentClassName = "text-primary",
  showText = true,
}) {
  return (
    <>
      <img
        src={logoImg}
        alt="The Strength Way"
        width={64}
        height={64}
        className={`${imageClassName} shrink-0 rounded-full object-cover`}
      />
      {showText && (
        <span className={`whitespace-nowrap ${textClassName}`}>
          THE STRENGTH<span className={accentClassName}> WAY</span>
        </span>
      )}
    </>
  );
}
