import { DefaultGroupIcon } from "@/components/Icons";

const GroupIcon = ({ src, size = 20 }) => (
  <span
    className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-500"
    style={{ width: size, height: size }}
  >
    {src ? (
      <img src={src} alt="" className="h-full w-full object-cover" />
    ) : (
      <DefaultGroupIcon size={Math.round(size * 0.7)} />
    )}
  </span>
);

export default GroupIcon;
