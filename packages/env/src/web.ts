import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  client: {
    /**
     * Optional. Without it the map runs on Esri World Imagery, which needs no
     * key. Set it to swap the basemap over to Mapbox satellite tiles.
     */
    NEXT_PUBLIC_MAPBOX_TOKEN: z.string().startsWith("pk.").optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  emptyStringAsUndefined: true,
});
