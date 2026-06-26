import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { BrandMark } from "../components/common/BrandMark.jsx";
import { Button } from "../components/ui/Button.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Register() {
  const { register, handleSubmit } = useForm();
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();

  const submit = async (values) => {
    await createAccount(values.email, values.password);
    navigate("/dashboard");
  };

  return (
    <section className="grid min-h-screen place-items-center bg-captain-black px-4 py-20">
      <form onSubmit={handleSubmit(submit)} className="w-full max-w-md rounded-lg border border-captain-gold/30 bg-captain-card p-6 shadow-gold">
        <div className="mb-7 flex justify-center"><BrandMark /></div>
        <h1 className="font-display text-5xl text-white">REGISTER</h1>
        <div className="mt-6 grid gap-4">
          <input {...register("email", { required: true })} className="form-input" placeholder="Email" />
          <input {...register("password", { required: true })} type="password" className="form-input" placeholder="Password" />
        </div>
        <Button type="submit" className="mt-6 w-full">Create Account</Button>
      </form>
    </section>
  );
}
