import "./styles/globals.css";
import { FinderLayout } from "./components/finder/FinderLayout";
import { UpdateChecker } from "./components/UpdateChecker";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <>
      <FinderLayout />
      <UpdateChecker />
      <Toaster position="top-center" />
    </>
  );
}

export default App;
