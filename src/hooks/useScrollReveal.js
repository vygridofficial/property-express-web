export const revealVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] } 
  }
};

export const revealViewport = { once: true, amount: 0.2 };
