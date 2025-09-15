import { useNavigate } from "react-router-dom";
import { WelcomeFlow } from "@/components/WelcomeFlow";

export default function Welcome() {
  const navigate = useNavigate();
  return <WelcomeFlow onComplete={() => navigate("/dashboard")} />;
}


