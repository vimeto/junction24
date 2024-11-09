import { redirect } from "next/navigation";

export default function RealtimePage() {
  redirect("/");
  return null; // Return null as this component won't render
}
