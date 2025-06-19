import React from "react";
import { useFullscreen } from "@mantine/hooks";

const FullScreenMediaBox = ({
  children,
  mediaType = "image"
  src,
  width = 300,
  height = 300,
  ...props
}: React.ComponentPropsWithRef<"section"> & {
  mediaType?: "image" | "video",
  src: string,
  width?: number,
  height?: number
}) => {
  const { ref: mediaElemRef, toggle, fullscreen } = useFullScreen();

  return (
    <section {...props}>
      {mediaType === "image"
        ?
          <img 
            src={src}
            ref={ref}
            width={width}
            height={height}
            alt=""
          />
        :
          <video
            src={src}
            ref={ref}
            width={width}
            height={height}
            alt=""
          ></video>
      }
    </section>
  );
};

export default FullScreenMediaBox;
