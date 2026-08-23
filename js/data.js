/**
 * Base de Datos Actualizada y Configuración Oficial - TAEKWONDO INNAEDO
 */

const INITIAL_GROUPS = [
    { id: "ADOLESCENTES", name: "Adolescentes", icon: "user-ninja", description: "Entrenamiento formativo, técnica de combate (Kyorugi) y disciplina juvenil" },
    { id: "NIÑOS 5 A 11", name: "Niños (5 a 11 Años)", icon: "child", description: "Desarrollo psicomotriz, respeto, autocontrol y fundamentos marciales" },
    { id: "CINTURONES NEGROS", name: "Cinturones Negros / Avanzados", icon: "medal", description: "Poomsae de alta maestría, alto rendimiento y cuerpo técnico" },
    { id: "BUGALAGRANDE", name: "Sede Bugalagrande", icon: "map-marker-alt", description: "Grupo y sede de entrenamiento en Bugalagrande" },
    { id: "PROFESORES", name: "Profesores / Maestros", icon: "chalkboard-teacher", description: "Sabonimes y Gran Master de Taekwondo & Hapkido INNAEDO" },
    { id: "Ninguno", name: "General / Nuevos", icon: "user-clock", description: "Nuevos ingresos y estudiantes en proceso de asignación" }
];

// LISTA OFICIAL Y COMPLETA DE CINTURONES SEGÚN EL REGLAMENTO
const BELTS = [
    { id: "blanco", name: "Blanco (10° Gup)", color: "#FFFFFF", textColor: "#0F172A", border: "#CBD5E1", badgeBg: "#F8FAFC" },
    { id: "blanco-amarillo", name: "Blanco Franja Amarilla (9° Gup)", color: "#FEF08A", textColor: "#854D0E", border: "#EAB308", badgeBg: "#FEF9C3" },
    { id: "amarillo", name: "Amarillo (8° Gup)", color: "#FACC15", textColor: "#713F12", border: "#CA8A04", badgeBg: "#FEF08A" },
    { id: "amarillo-verde", name: "Amarillo Franja Verde (7° Gup)", color: "#BEF264", textColor: "#3F6212", border: "#84CC16", badgeBg: "#ECFCCB" },
    { id: "verde", name: "Verde (6° Gup)", color: "#22C55E", textColor: "#FFFFFF", border: "#16A34A", badgeBg: "#DCFCE7" },
    { id: "verde-azul", name: "Verde Franja Azul (5° Gup)", color: "#059669", textColor: "#FFFFFF", border: "#2563EB", badgeBg: "#CCFBF1" },
    { id: "azul", name: "Azul (4° Gup)", color: "#2563EB", textColor: "#FFFFFF", border: "#1D4ED8", badgeBg: "#DBEAFE" },
    { id: "azul-rojo", name: "Azul Franja Roja (3° Gup)", color: "#1D4ED8", textColor: "#FFFFFF", border: "#E02B20", badgeBg: "#E0E7FF" },
    { id: "rojo", name: "Rojo (2° Gup)", color: "#E02B20", textColor: "#FFFFFF", border: "#B91C1C", badgeBg: "#FEE2E2" },
    { id: "rojo-punta-negra", name: "Rojo Punta / Barra Negra (1° Gup Menores)", color: "#B91C1C", textColor: "#FFFFFF", border: "#000000", badgeBg: "#FECACA" },
    { id: "rojo-franja-negra", name: "Rojo Franja Negra (1° Gup)", color: "#991B1B", textColor: "#FFFFFF", border: "#000000", badgeBg: "#FEE2E2" },
    { id: "poom-1", name: "1° Poom (Negro-Rojo Menores)", color: "#111827", textColor: "#EF4444", border: "#EF4444", badgeBg: "#FEE2E2" },
    { id: "poom-2", name: "2° Poom (Negro-Rojo Menores)", color: "#111827", textColor: "#EF4444", border: "#EF4444", badgeBg: "#FEE2E2" },
    { id: "poom-3", name: "3° Poom (Negro-Rojo Menores)", color: "#111827", textColor: "#EF4444", border: "#EF4444", badgeBg: "#FEE2E2" },
    { id: "negro-1dan", name: "Cinturón Negro 1° Dan", color: "#0F172A", textColor: "#D97706", border: "#D97706", badgeBg: "#FEF3C7" },
    { id: "negro-2dan", name: "Cinturón Negro 2° Dan", color: "#0F172A", textColor: "#D97706", border: "#D97706", badgeBg: "#FEF3C7" },
    { id: "negro-3dan", name: "Cinturón Negro 3° Dan", color: "#0F172A", textColor: "#D97706", border: "#D97706", badgeBg: "#FEF3C7" },
    { id: "negro-4dan", name: "Cinturón Negro 4° Dan (Maestro)", color: "#000000", textColor: "#FFB703", border: "#FFB703", badgeBg: "#FEF3C7" },
    { id: "gran-master", name: "Gran Master (Fundador)", color: "#78350F", textColor: "#FFD700", border: "#FFD700", badgeBg: "#FEF3C7" }
];

// PRINCIPIOS DEL TAEKWONDO
const TENETS_TKD = [
    { num: "01", name: "Cortesía", korean: "Ye Ui (예의)", desc: "Trato digno, respeto a maestros, compañeros, padres y adversarios." },
    { num: "02", name: "Integridad", korean: "Yom Chi (염치)", desc: "Saber distinguir lo correcto de lo erróneo y actuar con rectitud y honestidad." },
    { num: "03", name: "Perseverancia", korean: "In Nae (인내)", desc: "Paciencia y esfuerzo constante para superar cualquier obstáculo paso a paso." },
    { num: "04", name: "Autocontrol", korean: "Guk Gi (극기)", desc: "Dominio de nuestras emociones, fuerza y actos dentro y fuera del tatami." },
    { num: "05", name: "Espíritu Indomable", korean: "Baekjul Boolgool (백절불굴)", desc: "Coraje y valentía inquebrantable frente a las dificultades de la vida." }
];

// PRINCIPIOS DEL DOJANG INNAEDO
const DOJANG_PRINCIPLES = [
    { name: "Honor", icon: "shield-alt", desc: "Actuar con dignidad, orgullo marcial y respeto a nuestros valores." },
    { name: "Coraje", icon: "fist-raised", desc: "Enfrentar los temores y dar siempre lo mejor en el combate y en la vida." },
    { name: "Disciplina", icon: "clock", desc: "Puntualidad, constancia en los entrenamientos y orden personal." },
    { name: "Lealtad", icon: "heart", desc: "Fidelidad a nuestro Dojang, a nuestros maestros y a nuestra familia." },
    { name: "Obediencia", icon: "hands-helping", desc: "Acatar con humildad las enseñanzas, normas y correcciones marciales." },
    { name: "Amistad", icon: "users", desc: "Fraternidad sincera, compañerismo y apoyo mutuo entre practicantes." }
];

const INITIAL_STUDENTS = [
    // 1. Ninguno
    { id: "stu_1", name: "JUAN MARCOS DELGADO RODRIGUEZ", group: "Ninguno", belt: "blanco", phone: "", active: true },

    // 2. Cinturones Negros / Avanzados
    { id: "stu_2", name: "ANDRES RICARDO LINARES VANEGAS", group: "CINTURONES NEGROS", belt: "poom-1", phone: "", active: true },
    
    // 3. Adolescentes
    { id: "stu_3", name: "KAROL SOFIA NIETO POVEDA", group: "ADOLESCENTES", belt: "rojo-punta-negra", phone: "", active: true },
    { id: "stu_4", name: "JOSEPH MAVERICK MONTIEL PARRA", group: "ADOLESCENTES", belt: "rojo-punta-negra", phone: "", active: true },
    { id: "stu_5", name: "MIGUEL ANGEL ORTIZ ARIZA", group: "ADOLESCENTES", belt: "rojo", phone: "", active: true },
    { id: "stu_6", name: "JUAN SIMON GARCIA CUESTA", group: "ADOLESCENTES", belt: "rojo", phone: "", active: true },
    { id: "stu_7", name: "LUNA MICHELLE RUIZ VERA", group: "ADOLESCENTES", belt: "azul-rojo", phone: "", active: true },
    { id: "stu_8", name: "ESTEFANY MURILLO MOSCOSO", group: "ADOLESCENTES", belt: "azul-rojo", phone: "", active: true },
    { id: "stu_9", name: "MARTIN ESTEBAN ACOSTA MALAVER", group: "ADOLESCENTES", belt: "azul-rojo", phone: "", active: true },
    { id: "stu_10", name: "JUAN PABLO MONROY BELTRAN", group: "ADOLESCENTES", belt: "verde-azul", phone: "", active: true },
    { id: "stu_11", name: "GABRIELA ARCILA CALDERON", group: "ADOLESCENTES", belt: "verde-azul", phone: "", active: true },
    { id: "stu_12", name: "ANGEL GARCIA AMERICA", group: "ADOLESCENTES", belt: "verde", phone: "", active: true },
    { id: "stu_13", name: "NICOLAS GUSTAVO PEREZ BRIÑES", group: "ADOLESCENTES", belt: "verde", phone: "", active: true },
    { id: "stu_14", name: "OSCAR GABRIEL RAMIREZ RIVERA", group: "ADOLESCENTES", belt: "blanco-amarillo", phone: "", active: true },
    { id: "stu_15", name: "EDGAR IVAN MENDOZA MORA", group: "ADOLESCENTES", belt: "verde", phone: "", active: true },
    { id: "stu_16", name: "KELLY JOHANA APARICIO QUIROGA", group: "ADOLESCENTES", belt: "verde", phone: "", active: true },
    { id: "stu_17", name: "JULIAN ANDRES GARCIA FONSECA", group: "ADOLESCENTES", belt: "amarillo", phone: "", active: true },
    { id: "stu_18", name: "PAULA ANDREA LEYTON", group: "ADOLESCENTES", belt: "blanco", phone: "", active: true },
    { id: "stu_19", name: "ROUSSE HELENA LEYTON", group: "ADOLESCENTES", belt: "blanco", phone: "", active: true },
    { id: "stu_20", name: "JOSE ALEJANDRO ALZA PULIDO", group: "ADOLESCENTES", belt: "blanco", phone: "", active: true },
    
    // 4. Cinturones Negros / Avanzados
    { id: "stu_21", name: "VERONICA TRIVIÑO SANCHEZ", group: "CINTURONES NEGROS", belt: "negro-1dan", phone: "", active: true },
    
    // 5. Adolescentes (continuación)
    { id: "stu_22", name: "DAVID OVALLE SANCHEZ", group: "ADOLESCENTES", belt: "blanco-amarillo", phone: "", active: true },
    { id: "stu_23", name: "KEVIN SANTIAGO NIETO LEAL", group: "ADOLESCENTES", belt: "rojo", phone: "", active: true },

    // 6. Niños 5 a 11 Años
    { id: "stu_24", name: "MATEO GARCIA RODRIGUEZ", group: "NIÑOS 5 A 11", belt: "amarillo", phone: "", active: true },
    { id: "stu_25", name: "SAMUEL ESTEBAN CAMACHO TORRES", group: "NIÑOS 5 A 11", belt: "amarillo", phone: "", active: true },
    { id: "stu_26", name: "ISABELLA GALEANO BOHORQUEZ", group: "NIÑOS 5 A 11", belt: "amarillo", phone: "", active: true },
    { id: "stu_27", name: "WILLIAM CARO YAZO", group: "NIÑOS 5 A 11", belt: "blanco-amarillo", phone: "", active: true },
    { id: "stu_28", name: "SALOME CARO YAZO", group: "NIÑOS 5 A 11", belt: "blanco-amarillo", phone: "", active: true },
    { id: "stu_29", name: "VALERIA LOPEZ PINEDA", group: "NIÑOS 5 A 11", belt: "blanco", phone: "", active: true },
    { id: "stu_30", name: "JUAN NICOLAS ROMERO CELIS", group: "NIÑOS 5 A 11", belt: "verde-azul", phone: "", active: true },
    { id: "stu_31", name: "MARTIN ANDRES VARGAS MORALES", group: "NIÑOS 5 A 11", belt: "blanco", phone: "", active: true },
    { id: "stu_32", name: "ENOC ALEJANDRO BACA GUEVARA", group: "NIÑOS 5 A 11", belt: "blanco", phone: "", active: true },
    { id: "stu_33", name: "IAN ISAAC SEGURA GUERRERO", group: "NIÑOS 5 A 11", belt: "blanco", phone: "", active: true },
    { id: "stu_34", name: "MONICA TRIVIÑO SANCHEZ", group: "NIÑOS 5 A 11", belt: "blanco", phone: "", active: true },
    { id: "stu_35", name: "MATEO LOPEZ LEDESMA", group: "NIÑOS 5 A 11", belt: "blanco", phone: "", active: true },

    // 7. Profesores
    { id: "stu_36", name: "DYLAN KEITH MONTIEL PARRA", group: "PROFESORES", belt: "negro-4dan", phone: "", active: true },
    { id: "stu_37", name: "LUIS CASTELLANOS RAMOS", group: "PROFESORES", belt: "gran-master", phone: "", active: true },

    // 8. Cinturones Negros / Avanzados
    { id: "stu_38", name: "JAIME ANDRES NIETO POVEDA", group: "CINTURONES NEGROS", belt: "negro-3dan", phone: "", active: true },
    { id: "stu_39", name: "BRAYAN ANDRES PEDRAZA CESPEDES", group: "CINTURONES NEGROS", belt: "negro-3dan", phone: "", active: true },
    { id: "stu_40", name: "ERICK SANTIAGO HERRERA CAÑON", group: "CINTURONES NEGROS", belt: "negro-3dan", phone: "", active: true },
    { id: "stu_41", name: "MAYUMI ALEJANDRA SANCHEZ NUÑEZ", group: "CINTURONES NEGROS", belt: "negro-3dan", phone: "", active: true },

    // 9. Bugalagrande
    { id: "stu_42", name: "JUAN CARLOS CALDERON PINEDA", group: "BUGALAGRANDE", belt: "negro-2dan", phone: "", active: true },
    { id: "stu_43", name: "SARA SOFIA CALDERON GARCIA", group: "BUGALAGRANDE", belt: "negro-1dan", phone: "", active: true },
    { id: "stu_44", name: "EMMANUEL CASTRO ESTRADA", group: "BUGALAGRANDE", belt: "blanco", phone: "", active: true },
    { id: "stu_45", name: "ANDRES DAVID CARDONA MENDOZA", group: "BUGALAGRANDE", belt: "blanco", phone: "", active: true },
    { id: "stu_46", name: "SALOME IREGUI RICO", group: "BUGALAGRANDE", belt: "blanco", phone: "", active: true },
    { id: "stu_47", name: "MARIA ANGEL LÓPEZ VASQUEZ", group: "BUGALAGRANDE", belt: "blanco", phone: "", active: true },
    { id: "stu_48", name: "EMILY TORO CABRERA", group: "BUGALAGRANDE", belt: "blanco", phone: "", active: true },
    { id: "stu_49", name: "SAMUEL DAVID ALEGRIA SAAVEDRA", group: "BUGALAGRANDE", belt: "blanco", phone: "", active: true }
];

// EVENTOS Y NOVEDADES INICIALES DEL CLUB INNAEDO
const INITIAL_EVENTS = [];

// Generar historial de asistencia simulado
function generateInitialAttendance() {
    const records = {};
    const today = new Date();
    
    for (let i = 10; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayOfWeek = d.getDay();
        
        if (dayOfWeek !== 0) {
            const dateStr = d.toISOString().split('T')[0];
            records[dateStr] = {};
            
            INITIAL_STUDENTS.forEach((student, index) => {
                const rand = (index * 7 + i * 13) % 100;
                let status = "presente";
                let note = "";
                
                if (rand > 90) {
                    status = "ausente";
                } else if (rand > 82) {
                    status = "tardanza";
                    note = "Llegó 10 min tarde";
                } else if (rand > 78) {
                    status = "excusa";
                    note = "Permiso académico / médico";
                }
                
                records[dateStr][student.id] = {
                    status: status,
                    note: note,
                    updatedAt: d.toISOString()
                };
            });
        }
    }
    return records;
}
