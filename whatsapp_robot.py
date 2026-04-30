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

print("🚀 Iniciando Robot V3 (Modo Captura de Imagen)...")
chrome_options = Options()
# chrome_options.add_argument("--user-data-dir=./wa_session") 

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=chrome_options)
driver.get("https://web.whatsapp.com")

print("✅ Robot listo. Escanea el QR y deja la ventana visible.")

def send_to_whatsapp(phone, message, image_url=None):
    try:
        phone = "".join(filter(str.isdigit, phone))
        print(f"\n--- 📧 Enviando a: {phone} ---")
        
        # 1. Abrir chat (sin texto en la URL para evitar conflictos con la imagen)
        driver.get(f"https://web.whatsapp.com/send?phone={phone}")
        wait = WebDriverWait(driver, 40)
        
        # 2. Esperar a que el chat cargue
        print("⏳ Cargando chat...")
        text_box_xpath = '//div[@contenteditable="true"][@data-tab="10"]'
        wait.until(EC.element_to_be_clickable((By.XPATH, text_box_xpath)))
        time.sleep(2)

        if image_url:
            print(f"🖼️ Preparando imagen y texto...")
            # Descargar imagen
            img_data = requests.get(image_url).content
            temp_path = os.path.abspath("temp_wa_img.png")
            with open(temp_path, 'wb') as f:
                f.write(img_data)
            
            # 3. Clic en Adjuntar
            attach_selectors = [
                '//div[@title="Adjuntar"]', '//div[@title="Attach"]', 
                '//span[@data-icon="plus"]', '//span[@data-icon="attach-menu-plus"]'
            ]
            attach_btn = None
            for s in attach_selectors:
                try:
                    attach_btn = driver.find_element(By.XPATH, s)
                    break
                except: continue
            
            if not attach_btn: raise Exception("No se halló botón Adjuntar")
            driver.execute_script("arguments[0].click();", attach_btn)
            time.sleep(1.5)

            # 4. Subir archivo
            file_input = wait.until(EC.presence_of_element_located((By.XPATH, '//input[@type="file"]')))
            file_input.send_keys(temp_path)
            
            # 5. ESCRIBIR EL MENSAJE EN EL CAPTION (Pie de foto)
            print("✍️ Escribiendo mensaje en el pie de foto...")
            caption_xpath = '//div[@contenteditable="true"]//p'
            # A veces el caption tarda un poco en aparecer
            time.sleep(1.5)
            caption_box = wait.until(EC.element_to_be_clickable((By.XPATH, caption_xpath)))
            
            # Limpiar por si acaso y escribir
            caption_box.send_keys(message)
            time.sleep(1)
            
            # 6. Enviar
            print("📤 Enviando bloque completo...")
            caption_box.send_keys(Keys.ENTER)
        else:
            # Solo texto
            print("✍️ Enviando solo texto...")
            input_box = driver.find_element(By.XPATH, text_box_xpath)
            input_box.send_keys(message)
            time.sleep(0.5)
            input_box.send_keys(Keys.ENTER)
            
        print("✅ ¡Éxito!")
        time.sleep(1) 
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
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
