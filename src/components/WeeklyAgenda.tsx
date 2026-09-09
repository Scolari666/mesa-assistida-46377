const AGENDA = [
  {
    day: "TER",
    date: "Happy Hour",
    highlight: "Chope Pilsen 300ml por R$5",
    description: "Até as 19h. Trinca de chope pilsen G por R$25 a noite toda.",
  },
  {
    day: "QUA",
    date: "Compre 3, Leve 4",
    highlight: "A 4ª bebida é por nossa conta",
    description: "Válido para bebidas de menor valor entre as escolhidas.",
  },
  {
    day: "QUI",
    date: "Música ao Vivo",
    highlight: "Chope Pilsen G por R$10 até às 19h",
    description: "A partir das 20h, música ao vivo com atração da casa.",
  },
  {
    day: "SEX",
    date: "Sextou Porks",
    highlight: "Pista aberta até 1h",
    description: "Chope gelado, petiscos liberados e o melhor clima da cidade.",
  },
];

export const WeeklyAgenda = () => {
  return (
    <section id="agenda" className="py-20 md:py-28 bg-card relative overflow-hidden">
      <div className="absolute inset-0 bg-halftone opacity-30" aria-hidden />
      <div className="container px-4 md:px-6 relative">
        <div className="mb-12 text-center">
          <span className="font-hand text-primary text-2xl">Toda semana tem</span>
          <h2 className="text-4xl md:text-5xl">Agenda Semanal</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AGENDA.map((entry) => (
            <div
              key={entry.day}
              className="group bg-background border border-border rounded-lg p-6 hover:border-primary hover:-translate-y-1 transition-all duration-300 hover:shadow-glow"
            >
              <div className="font-display text-3xl text-primary mb-1">{entry.day}</div>
              <div className="text-sm uppercase tracking-wide text-muted-foreground mb-4">
                {entry.date}
              </div>
              <p className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {entry.highlight}
              </p>
              <p className="text-sm text-muted-foreground">{entry.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
