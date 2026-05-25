// Gooey SVG filter — apply with `style={{ filter: "url(#<id>)" }}` to a parent.
// The matrix on feColorMatrix is what makes blurred shapes "stick" to each other
// instead of fading out; values are the standard goo formula.

const GooeyFilter = ({
  id = "goo-filter",
  strength = 10,
}: {
  id?: string;
  strength?: number;
}) => {
  return (
    <svg className="hidden absolute">
      <defs>
        <filter id={id}>
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={strength}
            result="blur"
          />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
};

export { GooeyFilter };
