type ObjectType = "File" | "Folder";

type Obj = {
  path: String;
  name: String;
  object_type: ObjectType;
  relevance: number;
};

type GlobalState = {
  objects: Obj[];
  search_query: String;
  folder_only: boolean;
  expanded: Set<String>;
};
