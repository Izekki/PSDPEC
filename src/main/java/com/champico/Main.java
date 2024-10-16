package com.champico;

import com.champico.Entitys.Administrador; // Importa la clase Administrador
import com.champico.Entitys.Equipo; // Importa la clase Equipo
import com.champico.Entitys.Solicitude; // Importa la clase Solicitude
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Persistence;

import java.time.LocalDate;
import java.util.Scanner;

public class Main {
    private static EntityManagerFactory entityManagerFactory;

    public static void main(String[] args) {
        entityManagerFactory = Persistence.createEntityManagerFactory("miUnidadPersistencia"); // Cambia esto por tu unidad de persistencia

        Scanner scanner = new Scanner(System.in);
        int option;

        do {
            System.out.println("Menu:");
            System.out.println("1. Crear una solicitud");
            System.out.println("2. Salir");
            System.out.print("Selecciona una opción: ");
            option = scanner.nextInt();
            scanner.nextLine(); // Limpiar el buffer

            switch (option) {
                case 1:
                    crearSolicitud(scanner);
                    break;
                case 2:
                    System.out.println("Saliendo...");
                    break;
                default:
                    System.out.println("Opción no válida. Inténtalo de nuevo.");
            }
        } while (option != 2);

        entityManagerFactory.close();
        scanner.close();
    }

    private static void crearSolicitud(Scanner scanner) {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        entityManager.getTransaction().begin();

        try {
            Solicitude solicitud = new Solicitude();

            // Pedir datos al usuario
            System.out.print("Ingrese el tipo de usuario: ");
            String tipoUsuario = scanner.nextLine();
            solicitud.setTipoUsuario(tipoUsuario);

            System.out.print("Ingrese el estado de la solicitud: ");
            String estado = scanner.nextLine();
            solicitud.setEstado(estado);

            System.out.print("Ingrese la fecha de inicio (formato: yyyy-MM-dd): ");
            String fechaInicioStr = scanner.nextLine();
            LocalDate fechaInicio = LocalDate.parse(fechaInicioStr);
            solicitud.setFechaInicio(fechaInicio);

            System.out.print("Ingrese la fecha de entrega (formato: yyyy-MM-dd): ");
            String fechaEntregaStr = scanner.nextLine();
            LocalDate fechaEntrega = LocalDate.parse(fechaEntregaStr);
            solicitud.setFechaEntrega(fechaEntrega);

            System.out.print("Ingrese la ubicación actual (opcional, presione Enter para omitir): ");
            String ubicacionActual = scanner.nextLine();
            if (!ubicacionActual.isEmpty()) {
                solicitud.setUbicacionActual(ubicacionActual);
            }

            // Aquí puedes establecer el idAdmin y idEquipo según sea necesario
            // Por ejemplo, puedes buscar un Administrador y un Equipo existente en la base de datos
            // Asegúrate de que los IDs correspondan a objetos existentes

            // Ejemplo de asignación (asegúrate de que los IDs sean válidos):
            System.out.print("Ingrese el ID del Administrador: ");
            int adminId = scanner.nextInt();
            Administrador admin = entityManager.find(Administrador.class, adminId);
            solicitud.setIdAdmin(admin); // Establece el administrador

            System.out.print("Ingrese el ID del Equipo: ");
            int equipoId = scanner.nextInt();
            Equipo equipo = entityManager.find(Equipo.class, equipoId);
            solicitud.setIdEquipo(equipo); // Establece el equipo

            entityManager.persist(solicitud);
            entityManager.getTransaction().commit();
            System.out.println("Solicitud creada exitosamente.");
        } catch (Exception e) {
            entityManager.getTransaction().rollback();
            System.out.println("Error al crear la solicitud: " + e.getMessage());
        } finally {
            entityManager.close();
        }
    }
}
