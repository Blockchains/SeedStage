export type Tuple = {
  user: string;
  relation: "viewer";
  object: string;
};

export function documentObject(documentId: string): string {
  return `document:${documentId}`;
}

export function canView(tuples: Tuple[], userId: string, object: string): boolean {
  const user = `user:${userId}`;
  return tuples.some((tuple) => tuple.user === user && tuple.relation === "viewer" && tuple.object === object);
}
