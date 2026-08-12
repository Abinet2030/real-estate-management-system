import './HowItWorks.css'

const steps = [
  {
    number: '01',
    title: 'Discover the right property',
    desc: 'Explore verified homes and filter by location, budget, and the features that matter to you.',
  },
  {
    number: '02',
    title: 'Schedule a guided viewing',
    desc: 'Connect directly with a property professional to ask questions and arrange a convenient visit.',
  },
  {
    number: '03',
    title: 'Move forward with confidence',
    desc: 'Submit your offer and receive clear support through every step of your property journey.',
  },
]

export default function HowItWorks() {
  return (
    <section className="how-it-works">
      <div className="how-it-works__inner">
        <div className="how-it-works__heading">
          <span>Simple by design</span>
          <h2>Your next home, made straightforward.</h2>
          <p>From first search to final decision, Relstate makes every stage feel clear and well supported.</p>
        </div>

        <div className="how-it-works__steps">
          {steps.map((step) => (
            <article className="how-it-works__card" key={step.number}>
              <span className="how-it-works__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
