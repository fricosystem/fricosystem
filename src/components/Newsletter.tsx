import NewsletterForm from "./NewsletterForm";

interface NewsletterProps {
  variant?: "colorful" | "minimal";
}

const Newsletter = ({ variant = "colorful" }: NewsletterProps) => {
  if (variant === "minimal") {
    return (
      <section className="bg-black text-white py-16 md:py-20">
        <div className="px-5 md:px-20 max-w-4xl mx-auto">
          <NewsletterForm
            className="justify-center"
            inputClassName="border-white text-white placeholder:text-white"
            buttonClassName="border-white text-white hover:bg-white hover:text-black"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-accent-pink py-16 md:py-20">
      <div className="px-5 md:px-20 max-w-4xl mx-auto">
        <NewsletterForm className="justify-center" />
      </div>
    </section>
  );
};

export default Newsletter;
