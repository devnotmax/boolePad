import type { SVGProps } from "react";

export function DeleteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M21 5H7v2H5v2H3v2H1v2h2v2h2v2h2v2h16V5zM7 17v-2H5v-2H3v-2h2V9h2V7h14v10zm8-6h-2V9h-2v2h2v2h-2v2h2v-2h2v2h2v-2h-2zm0 0V9h2v2z"
      ></path>
    </svg>
  );
}
