import time
import requests
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

app = Flask(__name__)
CORS(app)

print("🚀 Iniciando Robot V2 (Estabilidad Mejorada)...")
chrome_options = Options()
# chrome_options.add_argument("--user-data-dir=./wa_session") # Opcional: guardar sesión

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
driver.get("https://web.whatsapp.com")

print("✅ Robot listo. Escanea el QR y espera a que carguen tus chats.")

def send_to_whatsapp(phone, message, image_url=None):
    try:
        phone = "".join(filter(str.isdigit, phone))
        print(f"\n--- 📧 Procesando: {phone} ---")
        
        # 1. Abrir chat
        driver.get(f"https://web.whatsapp.com/send?phone={phone}&text={message}")
        wait = WebDriverWait(driver, 40)
        
        # 2. Esperar a que el cuadro de texto sea editable
        print("⏳ Esperando a que cargue el chat...")
        text_box_xpath = '//div[@contenteditable="true"][@data-tab="10"]'
        input_box = wait.until(EC.element_to_be_clickable((By.XPATH, text_box_xpath)))
        time.sleep(3) # Tiempo de gracia para que WA se asiente

        if image_url:
            print(f"🖼️ Intentando adjuntar imagen: {image_url}")
            # Descargar imagen
            img_data = requests.get(image_url).content
            temp_path = os.path.abspath("temp_wa_img.png")
            with open(temp_path, 'wb') as f:
                f.write(img_data)
            
            # 3. Buscar botón Adjuntar (varios selectores)
            print("📎 Buscando botón adjuntar...")
            attach_selectors = [
                '//div[@title="Adjuntar"]', 
                '//div[@title="Attach"]', 
                '//span[@data-icon="plus"]', 
                '//span[@data-icon="attach-menu-plus"]',
                '//div[@role="button"]//span[@data-icon="plus"]'
            ]
            attach_btn = None
            for selector in attach_selectors:
                try:
                    attach_btn = driver.find_element(By.XPATH, selector)
                    if attach_btn: break
                except: continue
            
            if not attach_btn:
                raise Exception("No se encontró el botón de adjuntar")

            # Clic usando JavaScript para mayor seguridad
            driver.execute_script("arguments[0].click();", attach_btn)
            time.sleep(2)

            # 4. Encontrar input de archivo
            print("📁 Buscando input de archivo...")
            file_input = wait.until(EC.presence_of_element_located((By.XPATH, '//input[@type="file"]')))
            file_input.send_keys(temp_path)
            
            # 5. Esperar botón de enviar imagen
            print("📤 Esperando botón de envío...")
            send_btn_xpath = '//span[@data-icon="send"] | //div[@role="button"]//span[@data-icon="send"]'
            send_btn = wait.until(EC.element_to_be_clickable((By.XPATH, send_btn_xpath)))
            time.sleep(1)
            send_btn.click()
            print("✅ Imagen y texto enviados correctamente.")
        else:
            input_box.send_keys(Keys.ENTER)
            print("✅ Texto enviado correctamente.")
            
        time.sleep(2) # Esperar a que se procese el envío antes de saltar al siguiente
        return True
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

@app.route('/send', methods=['POST'])
def api_send():
    try:
        data = request.json
        success = send_to_whatsapp(data.get('phone'), data.get('text'), data.get('image'))
        return jsonify({"success": success})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(port=5000, debug=False, use_reloader=False)
