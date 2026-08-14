import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, CheckCircle2 } from "lucide-react";

export const ContactoPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    
    setSent(true);
    setName("");
    setEmail("");
    setMessage("");
    setTimeout(() => setSent(false), 5000);
  };

  const contactOptions = [
    { label: "Línea Telefónica", val: "343 505 2020", desc: "Lun a Vie 9 a 20 hs | Sáb 9 a 13 hs", icon: Phone },
    { label: "Laboratorio & Instituto Central", val: "Gualeguaychú 595, Paraná, Entre Ríos", desc: "Capacitaciones y Servicio Técnico", icon: MapPin },
    { label: "Soporte WhatsApp", val: "+54 9 343 505-2020", desc: "Atención rápida con técnicos especializados", icon: MessageCircle },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-12 font-sans tech-bg">
      
      {/* Page Header */}
      <div className="border-b border-border/40 pb-4 text-center max-w-xl mx-auto space-y-2">
        <span className="text-[10px] font-serif uppercase tracking-widest text-accent font-bold">Sucursales e Información</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Contacto Comercial</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          ¿Tenés alguna consulta institucional, venta corporativa o duda sobre nuestros servicios? Ponete en contacto mediante cualquiera de nuestros canales oficiales de atención.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
        
        {/* Left Panel: Contact Info Card */}
        <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <span className="text-[10px] text-accent uppercase font-serif tracking-widest block font-bold">Canales Directos</span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Información de Sucursal</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              DR.TECNO cuenta con su sede central, laboratorio técnico de alta tecnología e Instituto de Formación en Paraná, Entre Ríos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {contactOptions.map((opt) => {
              const IconC = opt.icon;
              return (
                <div key={opt.label} className="p-4 bg-muted/40 border border-border/40 rounded-xl space-y-2">
                  <div className="text-accent">
                    <IconC className="w-5 h-5 animate-pulse-subtle" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-serif uppercase tracking-wider font-semibold block">{opt.label}</span>
                    <p className="text-xs text-foreground font-bold leading-normal truncate">{opt.val}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-muted rounded-xl flex items-center gap-2.5 text-xs text-muted-foreground border border-border/40 mt-4">
            <Clock className="w-5 h-5 text-accent shrink-0 animate-spin" style={{ animationDuration: "12s" }} />
            <div>
              <p className="font-semibold text-foreground">Horarios de Atención y Recepción</p>
              <p className="text-[10px] mt-0.5">Lunes a Viernes de 09:00 a 20:00 hs | Sábados de 09:00 a 13:00 hs.</p>
            </div>
          </div>
        </section>

        {/* Right Panel: Message Form Card */}
        <section className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-1.5 border-b border-border/30 pb-3">
            <span className="px-2.5 py-0.5 bg-accent/15 border border-accent/25 text-[9px] text-accent font-serif uppercase font-bold rounded">
              Formulario de Contacto
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Send className="w-5 h-5 text-accent" />
              <span>Enviá un Mensaje</span>
            </h3>
            <p className="text-xs text-muted-foreground">Comunicate directamente con la gerencia o ventas.</p>
          </div>

          {sent ? (
            <div className="p-8 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-center space-y-3 animate-scale-up py-16">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="font-serif font-bold text-base text-foreground">¡Mensaje Enviado Correctamente!</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-normal">
                Tu inquietud ya fue asignada a un asesor comercial. Te responderemos en tu correo de contacto dentro de las próximas horas hábiles.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-foreground font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sofia Martínez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-semibold">Correo Electrónico de contacto *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: sofia@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground font-semibold">Mensaje o Inquietud *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribí tu consulta sobre ventas corporativas, presupuestos, stock..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-accent text-accent-foreground font-serif font-bold uppercase tracking-wider rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer pt-0.5"
              >
                <span>Enviar Mensaje</span>
              </button>
            </form>
          )}
        </section>

      </div>

    </div>
  );
};
