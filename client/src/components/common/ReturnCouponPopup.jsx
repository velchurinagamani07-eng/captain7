import { useNavigate } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "../ui/Button.jsx";
import { Modal } from "../ui/Modal.jsx";
import { useReturnVisitor } from "../../hooks/useReturnVisitor.js";
import { BrandMark } from "./BrandMark.jsx";

export function ReturnCouponPopup() {
  const navigate = useNavigate();
  const { couponVisible, dismiss, copy, copied, config } = useReturnVisitor();

  return (
    <Modal open={couponVisible} onClose={dismiss} title="Welcome Back">
      <div className="flex flex-col items-center text-center">
        <BrandMark size="md" />
        <p className="mt-5 text-white/70">We missed you. Here is a special offer just for you.</p>
        <div className="my-6 w-full rounded-lg border border-dashed border-captain-gold bg-captain-gold/10 p-6">
          <Ticket className="mx-auto mb-3 text-captain-bright" size={32} />
          <div className="font-mono text-3xl font-extrabold tracking-[0.18em] text-captain-bright">{config.couponCode}</div>
          <p className="mt-2 text-sm text-white/70">{config.discountText}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={copy} variant="secondary">
            {copied ? "Copied" : "Copy Code"}
          </Button>
          <Button
            onClick={() => {
              dismiss();
              navigate("/cricket-booking");
            }}
            showArrow
          >
            Use Now
          </Button>
        </div>
        <button type="button" onClick={dismiss} className="mt-5 text-sm text-white/50 transition hover:text-white">
          Maybe later
        </button>
      </div>
    </Modal>
  );
}
