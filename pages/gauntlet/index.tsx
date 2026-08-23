import { useRouter } from "next/router";
import { useEffect } from "react";

export default function GauntletIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/gauntlet/current");
  }, [router]);

  return null;
}
