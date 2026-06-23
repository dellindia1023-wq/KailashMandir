import { ReactNode, useEffect, useState } from "react";
import { RouteObject, useLocation, useRoutes } from "react-router-dom";

interface RouteCacheProps {
  routes: RouteObject[];
}

const RouteCache = ({ routes }: RouteCacheProps) => {
  const location = useLocation();
  const activeElement = useRoutes(routes, location);
  const [cache, setCache] = useState<Map<string, React.ReactNode>>(() => new Map());
  const cacheKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!activeElement) {
      return;
    }

    setCache((previous) => {
      if (previous.has(cacheKey)) {
        return previous;
      }
      const next = new Map(previous);
      next.set(cacheKey, activeElement);
      return next;
    });
  }, [activeElement, cacheKey]);

  return (
    <>
      {Array.from(cache.entries()).map(([key, element]) => (
        <div key={key} style={{ display: key === cacheKey ? undefined : "none" }}>
          {element}
        </div>
      ))}
      {!cache.has(cacheKey) && activeElement}
    </>
  );
};

export default RouteCache;
