import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const scrollPositions = new Map<string, number>();

const ScrollRestoration = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousKeyRef = useRef(`${location.pathname}${location.search}`);

  useEffect(() => {
    return () => {
      scrollPositions.set(previousKeyRef.current, window.scrollY);
    };
  }, [location]);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    const savedPosition = scrollPositions.get(key);

    if (savedPosition != null) {
      window.scrollTo({ top: savedPosition, behavior: "auto" });
    } else if (navigationType !== "POP") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    previousKeyRef.current = key;
  }, [location, navigationType]);

  return null;
};

export default ScrollRestoration;
