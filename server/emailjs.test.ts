import { describe, expect, it } from "vitest";

/**
 * Test to validate EmailJS credentials are properly configured
 * This test verifies that the environment variables are set correctly
 */
describe("EmailJS Configuration", () => {
  it("should have all required EmailJS environment variables set", () => {
    const serviceId = process.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = process.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY;

    expect(serviceId).toBeDefined();
    expect(templateId).toBeDefined();
    expect(publicKey).toBeDefined();

    expect(serviceId).toBe("service_vrnfhtl");
    expect(templateId).toBe("template_7crdjj8");
    expect(publicKey).toBe("Ezwb-ggi5WVMwD3dK");
  });

  it("should have valid EmailJS credential format", () => {
    const serviceId = process.env.VITE_EMAILJS_SERVICE_ID || "";
    const templateId = process.env.VITE_EMAILJS_TEMPLATE_ID || "";
    const publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY || "";

    // Service ID should start with 'service_'
    expect(serviceId).toMatch(/^service_/);

    // Template ID should start with 'template_'
    expect(templateId).toMatch(/^template_/);

    // Public key should be a non-empty string
    expect(publicKey.length).toBeGreaterThan(0);
  });
});
