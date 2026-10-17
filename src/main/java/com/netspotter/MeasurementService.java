
package com.netspotter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MeasurementService {

    private final MeasurementRepository measurementRepository;

    public MeasurementService(MeasurementRepository measurementRepository) {
        this.measurementRepository = measurementRepository;
    }

    @Transactional
    public Measurement saveMeasurement(Measurement measurement) {
        if (measurement == null) {
            throw new IllegalArgumentException("Measurement cannot be null.");
        }

        if (measurement.getLatitude() == null
                || measurement.getLongitude() == null) {
            throw new IllegalArgumentException(
                    "Latitude and longitude are required.");
        }

        if (measurement.getLatitude() < -90
                || measurement.getLatitude() > 90) {
            throw new IllegalArgumentException(
                    "Latitude must be between -90 and 90.");
        }

        if (measurement.getLongitude() < -180
                || measurement.getLongitude() > 180) {
            throw new IllegalArgumentException(
                    "Longitude must be between -180 and 180.");
        }

        return measurementRepository.save(measurement);
    }

    @Transactional(readOnly = true)
    public List<Measurement> getAllMeasurements() {
        return measurementRepository.findAll();
    }
}
