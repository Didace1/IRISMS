package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.model.Sale;
import com.aidevice.smartfix.model.Warranty;
import com.aidevice.smartfix.repository.SaleRepository;
import com.aidevice.smartfix.repository.WarrantyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warranties")
public class WarrantyController {

    private final WarrantyRepository warrantyRepository;
    private final SaleRepository saleRepository;

    public WarrantyController(WarrantyRepository warrantyRepository, SaleRepository saleRepository) {
        this.warrantyRepository = warrantyRepository;
        this.saleRepository = saleRepository;
    }

    @GetMapping
    public List<Warranty> list() {
        return warrantyRepository.findAll();
    }

    @GetMapping("/search")
    public List<Warranty> search(@RequestParam(required = false) String serialNumber,
                                  @RequestParam(required = false) String customerRef) {
        if (serialNumber != null && !serialNumber.isBlank()) {
            return warrantyRepository.findBySerialNumber(serialNumber);
        }
        if (customerRef != null && !customerRef.isBlank()) {
            return warrantyRepository.findByCustomerRef(customerRef);
        }
        return List.of();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Warranty warranty = new Warranty();
        warranty.setDeviceType((String) body.getOrDefault("deviceType", ""));
        warranty.setDeviceModel((String) body.getOrDefault("deviceModel", ""));
        warranty.setSerialNumber((String) body.getOrDefault("serialNumber", ""));
        warranty.setCustomerRef((String) body.getOrDefault("customerRef", ""));
        warranty.setCustomerName((String) body.getOrDefault("customerName", ""));
        warranty.setNotes((String) body.get("notes"));

        int months = body.containsKey("warrantyMonths") ? ((Number) body.get("warrantyMonths")).intValue() : 12;
        warranty.setWarrantyMonths(months);

        LocalDate purchaseDate = body.containsKey("purchaseDate")
                ? LocalDate.parse((String) body.get("purchaseDate"))
                : LocalDate.now();
        warranty.setPurchaseDate(purchaseDate);
        warranty.setExpiryDate(purchaseDate.plusMonths(months));
        warranty.setStatus("ACTIVE");
        warranty.setCreatedAt(LocalDateTime.now());

        if (body.containsKey("saleId") && body.get("saleId") != null) {
            Long saleId = Long.valueOf(body.get("saleId").toString());
            Sale sale = saleRepository.findById(saleId).orElse(null);
            warranty.setSale(sale);
        }

        Warranty saved = warrantyRepository.save(warranty);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Warranty warranty = warrantyRepository.findById(id).orElse(null);
        if (warranty == null) return ResponseEntity.notFound().build();

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status is required"));
        }
        warranty.setStatus(newStatus.toUpperCase());
        return ResponseEntity.ok(warrantyRepository.save(warranty));
    }
}
