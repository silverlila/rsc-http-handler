import React, { Suspense } from "react";

export default function Home() {
  const somePromise = new Promise((resolve: any) =>
    setTimeout(() => resolve("Some data"), 3000)
  );

  return (
    <div>
      <h1>This is the header</h1>
      <Suspense fallback="Loading...">
        <Body promise={somePromise} />
      </Suspense>
    </div>
  );
}

async function Body(props: { promise: Promise<any> }) {
  const response = await props.promise;
  return <div>{response}</div>;
}
