var tlv = function() {

    function hexToBytes (hex) {
        for (var bytes = [], c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    }

    function bytesToHex (bytes) {
        for (var hex = [], i = 0; i < bytes.length; i++) {
            var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
            hex.push((current >>> 4).toString(16));
            hex.push((current & 0xF).toString(16));
        }
        return hex.join("").toUpperCase();
    }

    function parseTag (buf) {
        var index = 0;
        var tag = buf[index++];       
        var constructed = (tag & 0x20) == 0x20;
    
        if ((tag & 0x1F) == 0x1F) {
            do {
                tag = tag << 8;
                tag = tag | buf[index++];
            } while((tag & 0x80) == 0x80);
        }
    
        return { tag: tag, length: index, constructed: constructed };
    }

    function parseAll (buf) {
        var tlvs = [];
    
        for (var i = 0; i < buf.length; i += tlvs[tlvs.length - 1].tlvLength) {
            var tlv = parse(buf.slice(i));
            tlvs.push(tlv);
        }
    
        return tlvs;
    }

    function parse(buf) {
        var index = 0;
        var tag = parseTag(buf);
        index += tag.length;
    
        var len = 0;
        var value;
    
        if ((buf[index] & 0x80) == 0x80) {
            var lenOfLen = buf[index++] & 0x7F;
            while(lenOfLen > 0) {
                len = len | buf[index++];
    
                if (lenOfLen > 1) {
                    len = len << 8;
                }
    
                lenOfLen--;
            }
        } else {
            len = buf[index++];
        }
    
        value = buf.slice(index, index + len);
        index += len;
    
        if (tag.constructed) {
            value = parseAll(value);
        }
    
        return {
            tag: tag.tag,
            value: value,
            tlvLength: index,
            constructed: tag.constructed
        };
    };

    function putTlv(obj, tlv) {
        if (tlv.constructed) {
            for(let t of tlv.value) {
                putTlv(obj, t);
            }
        } else {
            obj[tlv.tag.toString(16).toUpperCase()] = bytesToHex(tlv.value);
        }
    }
        

    return {

        parse: function(tlv) {
            var obj = {};
            var tlvs = parseAll(hexToBytes(tlv));
            for(let tlv of tlvs) {
                putTlv(obj, tlv);
            }
            return JSON.stringify(obj, null, 4);
        },

        encode: function(obj) {
            return '8A023030';
        }
    }
    
}();

