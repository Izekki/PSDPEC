package com.champico.BACK.Entitys;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "solicitudes")
public class Solicitude {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud", nullable = false)
    private Integer id;

    @Column(name = "tipo_usuario", nullable = false, length = 50)
    private String tipoUsuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_admin")
    private Administrador idAdmin;

    @Lob
    @Column(name = "estado", nullable = false)
    private String estado;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_entrega", nullable = false)
    private LocalDate fechaEntrega;

    @Column(name = "ubicacion_actual", length = 100)
    private String ubicacionActual;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_equipo")
    private Equipo idEquipo;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTipoUsuario() {
        return tipoUsuario;
    }

    public void setTipoUsuario(String tipoUsuario) {
        this.tipoUsuario = tipoUsuario;
    }

    public Administrador getIdAdmin() {
        return idAdmin;
    }

    public void setIdAdmin(Administrador idAdmin) {
        this.idAdmin = idAdmin;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaEntrega() {
        return fechaEntrega;
    }

    public void setFechaEntrega(LocalDate fechaEntrega) {
        this.fechaEntrega = fechaEntrega;
    }

    public String getUbicacionActual() {
        return ubicacionActual;
    }

    public void setUbicacionActual(String ubicacionActual) {
        this.ubicacionActual = ubicacionActual;
    }

    public Equipo getIdEquipo() {
        return idEquipo;
    }

    public void setIdEquipo(Equipo idEquipo) {
        this.idEquipo = idEquipo;
    }

}