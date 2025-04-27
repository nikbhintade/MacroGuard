type Props = {
  children?: React.ReactNode;
  customClass?: string;
  className?: string;
  noPadding?: boolean;
};

const Container = ({
  children,
  customClass = "",
  className = "",
  noPadding = false,
}: Props) => {
  return (
    <div
      className={`container w-full ${
        noPadding ? "px-0 lg:px-6" : "px-6"
      } mx-auto ${customClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default Container;
